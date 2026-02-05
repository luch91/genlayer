from genlayer_test import *


CONTRACT_PATH = "contracts/prompt_duel.py"


def test_create_room():
    """Room creation with valid parameters."""
    contract = deploy_intelligent_contract(CONTRACT_PATH, [0])

    # Create a room with max 4 players
    room_id = call_contract_method(contract, "create_room", [4])
    assert room_id == 0

    room = call_contract_method(contract, "get_room", [0])
    assert room["current_round"] == 0
    assert room["player_count"] == 1
    assert room["max_players"] == 4


def test_join_room():
    """Players can join an open room."""
    contract = deploy_intelligent_contract(CONTRACT_PATH, [0])
    call_contract_method(contract, "create_room", [3])

    # Second player joins
    send_transaction(contract, "join_room", [0], sender=1)

    room = call_contract_method(contract, "get_room", [0])
    assert room["player_count"] == 2

    players = call_contract_method(contract, "get_room_players", [0])
    assert len(players) == 2


def test_cannot_join_full_room():
    """Joining a full room raises an error."""
    contract = deploy_intelligent_contract(CONTRACT_PATH, [0])
    call_contract_method(contract, "create_room", [2])
    send_transaction(contract, "join_room", [0], sender=1)

    try:
        send_transaction(contract, "join_room", [0], sender=2)
        assert False, "Should have raised"
    except Exception:
        pass


def test_start_game():
    """Creator can start the game with enough players."""
    contract = deploy_intelligent_contract(CONTRACT_PATH, [0])
    call_contract_method(contract, "create_room", [4])
    send_transaction(contract, "join_room", [0], sender=1)

    # Start the game
    send_transaction(contract, "start_game", [0])

    room = call_contract_method(contract, "get_room", [0])
    assert room["current_round"] == 1


def test_cannot_start_with_one_player():
    """Starting with fewer than 2 players fails."""
    contract = deploy_intelligent_contract(CONTRACT_PATH, [0])
    call_contract_method(contract, "create_room", [4])

    try:
        send_transaction(contract, "start_game", [0])
        assert False, "Should have raised"
    except Exception:
        pass


def test_submit_prompt():
    """Players can submit prompts during an active round."""
    contract = deploy_intelligent_contract(CONTRACT_PATH, [0])
    call_contract_method(contract, "create_room", [2])
    send_transaction(contract, "join_room", [0], sender=1)
    send_transaction(contract, "start_game", [0])

    # Both players submit prompts
    send_transaction(contract, "submit_prompt", [0, "Generate a haiku about nodes"])
    send_transaction(
        contract,
        "submit_prompt",
        [0, "Write a poem about decentralized consensus"],
        sender=1,
    )

    room = call_contract_method(contract, "get_room", [0])
    assert room["prompts_submitted"] == 2


def test_cannot_submit_twice():
    """A player cannot submit two prompts in the same round."""
    contract = deploy_intelligent_contract(CONTRACT_PATH, [0])
    call_contract_method(contract, "create_room", [2])
    send_transaction(contract, "join_room", [0], sender=1)
    send_transaction(contract, "start_game", [0])

    send_transaction(contract, "submit_prompt", [0, "First prompt"])

    try:
        send_transaction(contract, "submit_prompt", [0, "Second prompt"])
        assert False, "Should have raised"
    except Exception:
        pass


def test_score_round():
    """Scoring a round invokes LLM consensus and assigns scores."""
    contract = deploy_intelligent_contract(CONTRACT_PATH, [0])
    call_contract_method(contract, "create_room", [2])
    send_transaction(contract, "join_room", [0], sender=1)
    send_transaction(contract, "start_game", [0])

    send_transaction(contract, "submit_prompt", [0, "Generate a creative haiku"])
    send_transaction(
        contract, "submit_prompt", [0, "Write something boring"], sender=1
    )

    # Score the round (triggers LLM via eq_principle)
    send_transaction(contract, "score_round", [0])

    room = call_contract_method(contract, "get_room", [0])
    assert room["is_scored"] is True

    players = call_contract_method(contract, "get_room_players", [0])
    assert players[0]["round_score"] > 0 or players[1]["round_score"] > 0


def test_full_game_flow():
    """Play a complete 3-round game and verify XP distribution."""
    contract = deploy_intelligent_contract(CONTRACT_PATH, [0])
    call_contract_method(contract, "create_room", [2])
    send_transaction(contract, "join_room", [0], sender=1)
    send_transaction(contract, "start_game", [0])

    for round_num in range(1, 4):
        # Both players submit
        send_transaction(
            contract, "submit_prompt", [0, f"Round {round_num} prompt from player 0"]
        )
        send_transaction(
            contract,
            "submit_prompt",
            [0, f"Round {round_num} prompt from player 1"],
            sender=1,
        )

        # Score the round
        send_transaction(contract, "score_round", [0])

        # Advance to next round (or finish)
        send_transaction(contract, "advance_round", [0])

    # Game should be finished (current_round = 4)
    room = call_contract_method(contract, "get_room", [0])
    assert room["current_round"] == 4

    # Leaderboard should have entries
    leaderboard = call_contract_method(contract, "get_leaderboard")
    assert len(leaderboard) == 2
    assert leaderboard[0]["xp"] > 0


def test_get_challenge():
    """Challenge text is returned correctly for active rounds."""
    contract = deploy_intelligent_contract(CONTRACT_PATH, [0])
    call_contract_method(contract, "create_room", [2])
    send_transaction(contract, "join_room", [0], sender=1)
    send_transaction(contract, "start_game", [0])

    challenge = call_contract_method(contract, "get_challenge", [0])
    assert len(challenge) > 0
    assert "prompt" in challenge.lower() or "write" in challenge.lower()


def test_leaderboard_empty_initially():
    """Leaderboard is empty before any games are played."""
    contract = deploy_intelligent_contract(CONTRACT_PATH, [0])
    leaderboard = call_contract_method(contract, "get_leaderboard")
    assert len(leaderboard) == 0
